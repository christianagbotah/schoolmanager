"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, Loader2, Mail, MessageSquare, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function CommunicationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [smsForm, setSmsForm] = useState({ provider: "", api_key: "", from_number: "" });
  const [emailForm, setEmailForm] = useState({ host: "", port: "587", username: "", password: "", from_email: "" });
  const [notifForm, setNotifForm] = useState({ email_notifs: true, sms_notifs: true, fee_reminders: true, attendance_alerts: true });

  const handleSaveSms = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "sms_provider", description: "SMS Provider", value: smsForm.provider }) }),
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "sms_api_key", description: "SMS API Key", value: smsForm.api_key }) }),
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "sms_from", description: "SMS From Number", value: smsForm.from_number }) }),
      ]);
      toast({ title: "Success", description: "SMS settings saved" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSaving(false);
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "smtp_host", description: "SMTP Host", value: emailForm.host }) }),
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "smtp_port", description: "SMTP Port", value: emailForm.port }) }),
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "smtp_username", description: "SMTP Username", value: emailForm.username }) }),
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "smtp_password", description: "SMTP Password", value: emailForm.password }) }),
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "smtp_from", description: "From Email", value: emailForm.from_email }) }),
      ]);
      toast({ title: "Success", description: "Email settings saved" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSaving(false);
  };

  const handleSaveNotifs = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "notif_email", description: "Email Notifications", value: notifForm.email_notifs ? "1" : "0" }) }),
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "notif_sms", description: "SMS Notifications", value: notifForm.sms_notifs ? "1" : "0" }) }),
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "notif_fees", description: "Fee Reminders", value: notifForm.fee_reminders ? "1" : "0" }) }),
        fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "notif_attendance", description: "Attendance Alerts", value: notifForm.attendance_alerts ? "1" : "0" }) }),
      ]);
      toast({ title: "Success", description: "Notification preferences saved" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Settings className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Communication Settings</h1><p className="text-emerald-200 text-xs hidden sm:block">SMS, Email & Notifications</p></div>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/admin/settings")}>Back to Settings</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Tabs defaultValue="sms" className="w-full">
          <TabsList className="mb-6 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="sms" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><MessageSquare className="w-4 h-4 mr-1 hidden sm:inline" /> SMS</TabsTrigger>
            <TabsTrigger value="email" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><Mail className="w-4 h-4 mr-1 hidden sm:inline" /> Email</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm"><Bell className="w-4 h-4 mr-1 hidden sm:inline" /> Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="sms">
            <Card className="border-slate-200/60 max-w-2xl">
              <CardHeader><CardTitle>SMS Provider Settings</CardTitle><CardDescription>Configure your SMS service provider</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2"><Label>Provider</Label><Select value={smsForm.provider} onValueChange={v => setSmsForm({ ...smsForm, provider: v })}><SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger><SelectContent><SelectItem value="twilio">Twilio</SelectItem><SelectItem value="africas_talking">Africa&apos;s Talking</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select></div>
                <div className="grid gap-2"><Label>API Key</Label><Input type="password" value={smsForm.api_key} onChange={e => setSmsForm({ ...smsForm, api_key: e.target.value })} placeholder="Enter API key" /></div>
                <div className="grid gap-2"><Label>From Number</Label><Input value={smsForm.from_number} onChange={e => setSmsForm({ ...smsForm, from_number: e.target.value })} placeholder="+233XXXXXXXXX" /></div>
                <Separator /><Button onClick={handleSaveSms} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save</>}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="border-slate-200/60 max-w-2xl">
              <CardHeader><CardTitle>SMTP Email Settings</CardTitle><CardDescription>Configure email delivery settings</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>SMTP Host</Label><Input value={emailForm.host} onChange={e => setEmailForm({ ...emailForm, host: e.target.value })} placeholder="smtp.gmail.com" /></div>
                  <div className="grid gap-2"><Label>Port</Label><Input value={emailForm.port} onChange={e => setEmailForm({ ...emailForm, port: e.target.value })} placeholder="587" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Username</Label><Input value={emailForm.username} onChange={e => setEmailForm({ ...emailForm, username: e.target.value })} placeholder="your@email.com" /></div>
                  <div className="grid gap-2"><Label>Password</Label><Input type="password" value={emailForm.password} onChange={e => setEmailForm({ ...emailForm, password: e.target.value })} /></div>
                </div>
                <div className="grid gap-2"><Label>From Email</Label><Input value={emailForm.from_email} onChange={e => setEmailForm({ ...emailForm, from_email: e.target.value })} placeholder="noreply@school.com" /></div>
                <Separator /><Button onClick={handleSaveEmail} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save</>}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-slate-200/60 max-w-2xl">
              <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Control which notifications are sent</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: "email_notifs" as const, label: "Email Notifications", desc: "Send notifications via email" },
                  { key: "sms_notifs" as const, label: "SMS Notifications", desc: "Send notifications via SMS" },
                  { key: "fee_reminders" as const, label: "Fee Payment Reminders", desc: "Send reminders for outstanding fees" },
                  { key: "attendance_alerts" as const, label: "Attendance Alerts", desc: "Alert parents about attendance issues" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div><p className="font-medium text-sm">{item.label}</p><p className="text-xs text-slate-500">{item.desc}</p></div>
                    <Switch checked={notifForm[item.key]} onCheckedChange={v => setNotifForm({ ...notifForm, [item.key]: v })} />
                  </div>
                ))}
                <Separator /><Button onClick={handleSaveNotifs} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save</>}</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}
