'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Palette, Sun, Moon, Monitor, Type, Upload, Check, Save,
  Eye, RefreshCw, Layout, Maximize2, MessageCircle,
} from 'lucide-react';

interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: string;
  sidebarPosition: 'left' | 'right';
  sidebarStyle: 'full' | 'compact' | 'icon-only';
  layout: 'wide' | 'boxed' | 'fluid';
  showLogo: boolean;
  showFooter: boolean;
  showBreadcrumb: boolean;
  enableAnimations: boolean;
  enableDarkMode: boolean;
  schoolName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
}

const COLOR_PRESETS = [
  { name: 'Emerald', primary: '#059669', accent: '#10b981' },
  { name: 'Blue', primary: '#2563eb', accent: '#3b82f6' },
  { name: 'Indigo', primary: '#4f46e5', accent: '#6366f1' },
  { name: 'Purple', primary: '#7c3aed', accent: '#8b5cf6' },
  { name: 'Rose', primary: '#e11d48', accent: '#f43f5e' },
  { name: 'Amber', primary: '#d97706', accent: '#f59e0b' },
  { name: 'Teal', primary: '#0d9488', accent: '#14b8a6' },
  { name: 'Orange', primary: '#ea580c', accent: '#f97316' },
];

const FONT_OPTIONS = [
  { label: 'Inter (Default)', value: 'inter' },
  { label: 'Poppins', value: 'poppins' },
  { label: 'Roboto', value: 'roboto' },
  { label: 'Open Sans', value: 'open-sans' },
  { label: 'Lato', value: 'lato' },
  { label: 'Nunito', value: 'nunito' },
];

export default function ThemeSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('colors');
  const [settings, setSettings] = useState<ThemeSettings>({
    primaryColor: '#059669',
    accentColor: '#10b981',
    fontFamily: 'inter',
    fontSize: 'medium',
    sidebarPosition: 'left',
    sidebarStyle: 'full',
    layout: 'wide',
    showLogo: true,
    showFooter: true,
    showBreadcrumb: true,
    enableAnimations: true,
    enableDarkMode: false,
    schoolName: '',
    tagline: '',
    logoUrl: '',
    faviconUrl: '',
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings?section=theme');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch {
      // Use defaults on error
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = async (section: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, settings }),
      });
      if (res.ok) {
        toast.success(`${section} settings saved successfully`);
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('Network error while saving');
    }
    setSaving(false);
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setSettings(prev => ({
      ...prev,
      primaryColor: preset.primary,
      accentColor: preset.accent,
    }));
    toast.success(`Applied ${preset.name} color preset`);
  };

  const resetToDefault = () => {
    setSettings({
      primaryColor: '#059669',
      accentColor: '#10b981',
      fontFamily: 'inter',
      fontSize: 'medium',
      sidebarPosition: 'left',
      sidebarStyle: 'full',
      layout: 'wide',
      showLogo: true,
      showFooter: true,
      showBreadcrumb: true,
      enableAnimations: true,
      enableDarkMode: false,
      schoolName: '',
      tagline: '',
      logoUrl: '',
      faviconUrl: '',
    });
    toast.info('Reset to default theme settings');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full max-w-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Theme Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Customize the appearance and branding of your school portal</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              <RefreshCw className="w-4 h-4 mr-2" />Reset Defaults
            </Button>
            <Button size="sm" onClick={() => saveSettings('theme')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save All
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="colors" className="data-[state=active]:bg-white"><Palette className="w-4 h-4 mr-2" />Colors</TabsTrigger>
            <TabsTrigger value="typography" className="data-[state=active]:bg-white"><Type className="w-4 h-4 mr-2" />Typography</TabsTrigger>
            <TabsTrigger value="layout" className="data-[state=active]:bg-white"><Layout className="w-4 h-4 mr-2" />Layout</TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-white"><Upload className="w-4 h-4 mr-2" />Branding</TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-white"><Maximize2 className="w-4 h-4 mr-2" />Features</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Color Presets</CardTitle>
                  <CardDescription>Choose from professionally designed color schemes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {COLOR_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          settings.primaryColor === preset.primary
                            ? 'border-slate-900 ring-2 ring-slate-900/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex gap-1 mb-2">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <p className="text-[10px] font-medium text-slate-600">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Custom Colors</CardTitle>
                  <CardDescription>Or define your own brand colors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Primary Color</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={e => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={e => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1 font-mono text-sm"
                        placeholder="#059669"
                      />
                      <div className="w-10 h-10 rounded-lg border" style={{ backgroundColor: settings.primaryColor }} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Accent Color</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={e => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={e => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="flex-1 font-mono text-sm"
                        placeholder="#10b981"
                      />
                      <div className="w-10 h-10 rounded-lg border" style={{ backgroundColor: settings.accentColor }} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Preview</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: settings.primaryColor }}>Primary Button</div>
                        <div className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: settings.primaryColor, color: settings.primaryColor }}>Outline Button</div>
                      </div>
                      <div className="flex gap-2">
                        <div className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: settings.accentColor }}>Accent Button</div>
                        <Badge style={{ backgroundColor: settings.primaryColor }}>Status Badge</Badge>
                        <Badge variant="outline" style={{ borderColor: settings.accentColor, color: settings.accentColor }}>Info Badge</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Font Settings</CardTitle>
                  <CardDescription>Configure typography across the portal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Font Family</Label>
                    <Select value={settings.fontFamily} onValueChange={v => setSettings(prev => ({ ...prev, fontFamily: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Base Font Size</Label>
                    <Select value={settings.fontSize} onValueChange={v => setSettings(prev => ({ ...prev, fontSize: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (14px)</SelectItem>
                        <SelectItem value="medium">Medium (16px) - Default</SelectItem>
                        <SelectItem value="large">Large (18px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Preview</CardTitle>
                  <CardDescription>See how your typography looks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                    <h1 className="text-2xl font-bold text-slate-900">Heading 1 - Dashboard</h1>
                    <h2 className="text-lg font-semibold text-slate-800">Heading 2 - Student Management</h2>
                    <h3 className="text-base font-medium text-slate-700">Heading 3 - Class List</h3>
                    <p className="text-sm text-slate-600">Body text - The quick brown fox jumps over the lazy dog. GHS 1,250.00 received from student fees.</p>
                    <p className="text-xs text-slate-500">Caption text - Last updated: April 16, 2026 at 10:30 AM</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Sidebar Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Position</Label>
                    <div className="flex gap-3 mt-2">
                      {(['left', 'right'] as const).map(pos => (
                        <button
                          key={pos}
                          onClick={() => setSettings(prev => ({ ...prev, sidebarPosition: pos }))}
                          className={`flex-1 p-4 rounded-lg border-2 text-center transition-all ${
                            settings.sidebarPosition === pos
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className={`text-lg font-medium ${settings.sidebarPosition === pos ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {pos === 'left' ? 'Left' : 'Right'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Style</Label>
                    <Select value={settings.sidebarStyle} onValueChange={v => setSettings(prev => ({ ...prev, sidebarStyle: v as ThemeSettings['sidebarStyle'] }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full (with labels)</SelectItem>
                        <SelectItem value="compact">Compact (small icons + labels)</SelectItem>
                        <SelectItem value="icon-only">Icon Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Content Layout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Layout Mode</Label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {([
                        { value: 'wide', label: 'Wide', desc: 'Full width' },
                        { value: 'boxed', label: 'Boxed', desc: 'Max width' },
                        { value: 'fluid', label: 'Fluid', desc: 'Responsive' },
                      ] as const).map(mode => (
                        <button
                          key={mode.value}
                          onClick={() => setSettings(prev => ({ ...prev, layout: mode.value }))}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            settings.layout === mode.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className={`text-sm font-medium ${settings.layout === mode.value ? 'text-emerald-700' : 'text-slate-600'}`}>{mode.label}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{mode.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card className="border-slate-200/60 max-w-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">School Branding</CardTitle>
                <CardDescription>Upload your school logo and customize branding text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">School Name</Label>
                    <Input
                      value={settings.schoolName}
                      onChange={e => setSettings(prev => ({ ...prev, schoolName: e.target.value }))}
                      className="mt-1"
                      placeholder="Ghana Education Service School"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Tagline</Label>
                    <Input
                      value={settings.tagline}
                      onChange={e => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                      className="mt-1"
                      placeholder="Excellence in Education"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Logo URL</Label>
                    <Input
                      value={settings.logoUrl}
                      onChange={e => setSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="mt-1"
                      placeholder="/uploads/logo.png"
                    />
                    <div className="mt-2 p-4 border border-dashed border-slate-300 rounded-lg text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-xs text-slate-500">Drag & drop or click to upload logo</p>
                      <p className="text-[10px] text-slate-400 mt-1">Recommended: 200x60px, PNG or SVG</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Favicon URL</Label>
                    <Input
                      value={settings.faviconUrl}
                      onChange={e => setSettings(prev => ({ ...prev, faviconUrl: e.target.value }))}
                      className="mt-1"
                      placeholder="/uploads/favicon.ico"
                    />
                    <div className="mt-2 p-4 border border-dashed border-slate-300 rounded-lg text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-xs text-slate-500">Drag & drop or click to upload favicon</p>
                      <p className="text-[10px] text-slate-400 mt-1">Recommended: 32x32px, ICO or PNG</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card className="border-slate-200/60 max-w-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Feature Toggles</CardTitle>
                <CardDescription>Enable or disable portal features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'showLogo' as const, label: 'Show School Logo', desc: 'Display the school logo in the sidebar and login page', icon: Eye },
                  { key: 'showFooter' as const, label: 'Show Footer', desc: 'Display footer with school info and links', icon: MessageCircle },
                  { key: 'showBreadcrumb' as const, label: 'Show Breadcrumb', desc: 'Display navigation breadcrumbs at the top of pages', icon: Layout },
                  { key: 'enableAnimations' as const, label: 'Enable Animations', desc: 'Smooth transitions and hover effects throughout the portal', icon: RefreshCw },
                  { key: 'enableDarkMode' as const, label: 'Enable Dark Mode', desc: 'Allow users to switch to dark theme (coming soon)', icon: Moon },
                ].map(item => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings[item.key] ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          settings[item.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
