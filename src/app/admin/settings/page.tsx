"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, Loader2, Globe, Mail, Phone, MapPin, GraduationCap, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Setting {
  settings_id: number; type: string; description: string; value: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [schoolForm, setSchoolForm] = useState({ name: "", logo: "", address: "", phone: "", email: "" });
  const [academicForm, setAcademicForm] = useState({ year: "", term: "", grading_system: "" });
  const [themeForm, setThemeForm] = useState({ primary_color: "#10b981", accent_color: "#f59e0b" });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/route");
      const data = await res.json();
      setSettings(Array.isArray(data) ? data : []);

      data.forEach((s: Setting) => {
        if (s.type === "school_name") setSchoolForm(f => ({ ...f, name: s.value }));
        if (s.type === "school_logo") setSchoolForm(f => ({ ...f, logo: s.value }));
        if (s.type === "school_address") setSchoolForm(f => ({ ...f, address: s.value }));
        if (s.type === "school_phone") setSchoolForm(f => ({ ...f, phone: s.value }));
        if (s.type === "school_email") setSchoolForm(f => ({ ...f, email: s.value }));
        if (s.type === "academic_year") setAcademicForm(f => ({ ...f, year: s.value }));
        if (s.type === "academic_term") setAcademicForm(f => ({ ...f, term: s.value }));
        if (s.type === "grading_system") setAcademicForm(f => ({ ...f, grading_system: s.value }));
        if (s.type === "primary_color") setThemeForm(f => ({ ...f, primary_color: s.value }));
        if (s.type === "accent_color") setThemeForm(f => ({ ...f, accent_color: s.value }));
      });
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSetting = async (type: string, description: string, value: string) => {
    await fetch("/api/settings/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, description, value }),
    });
  };

  const handleSaveSchool = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("school_name", "School Name", schoolForm.name),
        saveSetting("school_logo", "School Logo URL", schoolForm.logo),
        saveSetting("school_address", "School Address", schoolForm.address),
        saveSetting("school_phone", "School Phone", schoolForm.phone),
        saveSetting("school_email", "School Email", schoolForm.email),
      ]);
      toast({ title: "Success", description: "School settings saved" });
      fetchSettings();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSaving(false);
  };

  const handleSaveAcademic = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("academic_year", "Academic Year", academicForm.year),
        saveSetting("academic_term", "Current Term", academicForm.term),
        saveSetting("grading_system", "Grading System", academicForm.grading_system),
      ]);
      toast({ title: "Success", description: "Academic settings saved" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSaving(false);
  };

  const handleSaveTheme = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("primary_color", "Primary Color", themeForm.primary_color),
        saveSetting("accent_color", "Accent Color", themeForm.accent_color),
      ]);
      toast({ title: "Success", description: "Theme settings saved" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Settings className="w-6 h-6" /></div>
              <h1 className="text-lg font-bold">Settings</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="space-y-4"><div className="h-80 rounded-xl bg-slate-200 animate-pulse" /></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Settings className="w-6 h-6" /></div>
              <div><h1 className="text-lg font-bold">Settings</h1><p className="text-emerald-200 text-xs hidden sm:block">System Configuration</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/admin/settings/frontend")}>Frontend CMS</Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/admin/settings/communication")}>Communication</Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/")}>Dashboard</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Tabs defaultValue="school" className="w-full">
          <TabsList className="mb-6 bg-white border border-slate-200 p-1 rounded-xl h-auto flex w-full sm:w-auto">
            <TabsTrigger value="school" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <GraduationCap className="w-4 h-4 mr-1 hidden sm:inline" /> School
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">Academic</TabsTrigger>
            <TabsTrigger value="theme" className="flex-1 min-w-[100px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg py-2 text-sm">
              <Palette className="w-4 h-4 mr-1 hidden sm:inline" /> Theme
            </TabsTrigger>
          </TabsList>

          <TabsContent value="school">
            <Card className="border-slate-200/60 max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-600" /> School Information</CardTitle>
                <CardDescription>Basic school details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>School Name</Label>
                  <div className="relative"><GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={schoolForm.name} onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })} className="pl-10" placeholder="Enter school name" /></div>
                </div>
                <div className="grid gap-2">
                  <Label>Logo URL</Label>
                  <Input value={schoolForm.logo} onChange={e => setSchoolForm({ ...schoolForm, logo: e.target.value })} placeholder="https://example.com/logo.png" />
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={schoolForm.address} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} className="pl-10" placeholder="School address" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={schoolForm.phone} onChange={e => setSchoolForm({ ...schoolForm, phone: e.target.value })} className="pl-10" /></div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={schoolForm.email} onChange={e => setSchoolForm({ ...schoolForm, email: e.target.value })} className="pl-10" /></div>
                  </div>
                </div>
                <Separator />
                <Button onClick={handleSaveSchool} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic">
            <Card className="border-slate-200/60 max-w-2xl">
              <CardHeader>
                <CardTitle>Academic Settings</CardTitle>
                <CardDescription>Configure academic year, term, and grading</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Academic Year</Label><Input value={academicForm.year} onChange={e => setAcademicForm({ ...academicForm, year: e.target.value })} placeholder="2025" /></div>
                  <div className="grid gap-2">
                    <Label>Current Term</Label>
                    <Select value={academicForm.term} onValueChange={v => setAcademicForm({ ...academicForm, term: v })}>
                      <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                      <SelectContent><SelectItem value="Term 1">Term 1</SelectItem><SelectItem value="Term 2">Term 2</SelectItem><SelectItem value="Term 3">Term 3</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Grading System</Label>
                  <Select value={academicForm.grading_system} onValueChange={v => setAcademicForm({ ...academicForm, grading_system: v })}>
                    <SelectTrigger><SelectValue placeholder="Select grading system" /></SelectTrigger>
                    <SelectContent><SelectItem value="percentage">Percentage (0-100)</SelectItem><SelectItem value="gpa">GPA (0-4.0)</SelectItem><SelectItem value="letter">Letter Grade (A-F)</SelectItem></SelectContent>
                  </Select>
                </div>
                <Separator />
                <Button onClick={handleSaveAcademic} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme">
            <Card className="border-slate-200/60 max-w-2xl">
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>Customize the color scheme of your school portal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={themeForm.primary_color} onChange={e => setThemeForm({ ...themeForm, primary_color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                      <Input value={themeForm.primary_color} onChange={e => setThemeForm({ ...themeForm, primary_color: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={themeForm.accent_color} onChange={e => setThemeForm({ ...themeForm, accent_color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                      <Input value={themeForm.accent_color} onChange={e => setThemeForm({ ...themeForm, accent_color: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl" style={{ backgroundColor: themeForm.primary_color }} />
                  <div className="w-16 h-16 rounded-xl" style={{ backgroundColor: themeForm.accent_color }} />
                </div>
                <Separator />
                <Button onClick={handleSaveTheme} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} School Manager</p></div></footer>
    </div>
  );
}
