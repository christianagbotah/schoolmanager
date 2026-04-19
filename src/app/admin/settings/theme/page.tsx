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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Palette, Save, RefreshCw, Check, Eye, SwatchBook, Paintbrush,
  Type, Layout, Maximize2, Monitor, Undo2,
} from 'lucide-react';

// CI3 predefined themes (matching theme_settings.php)
const PREDEFINED_THEMES = [
  { key: 'default', name: 'Default Blue', primary: '#667eea', secondary: '#764ba2', accent: '#f093fb' },
  { key: 'ocean', name: 'Ocean Blue', primary: '#2E3192', secondary: '#1BFFFF', accent: '#00d4ff' },
  { key: 'sunset', name: 'Sunset Orange', primary: '#f12711', secondary: '#f5af19', accent: '#ff6b6b' },
  { key: 'forest', name: 'Forest Green', primary: '#134E5E', secondary: '#71B280', accent: '#38ef7d' },
  { key: 'purple', name: 'Royal Purple', primary: '#5f27cd', secondary: '#341f97', accent: '#a29bfe' },
  { key: 'crimson', name: 'Crimson Red', primary: '#c0392b', secondary: '#e74c3c', accent: '#ff7979' },
  { key: 'teal', name: 'Teal Mint', primary: '#16a085', secondary: '#1abc9c', accent: '#48c9b0' },
  { key: 'midnight', name: 'Midnight Blue', primary: '#2c3e50', secondary: '#34495e', accent: '#3498db' },
];

const FONT_OPTIONS = [
  { label: 'Inter (Default)', value: 'inter' },
  { label: 'Poppins', value: 'poppins' },
  { label: 'Roboto', value: 'roboto' },
  { label: 'Open Sans', value: 'open-sans' },
  { label: 'Lato', value: 'lato' },
  { label: 'Nunito', value: 'nunito' },
];

const LAYOUT_OPTIONS = [
  { value: 'wide', label: 'Wide', desc: 'Full width' },
  { value: 'boxed', label: 'Boxed', desc: 'Max width' },
  { value: 'fluid', label: 'Fluid', desc: 'Responsive' },
];

const SIDEBAR_OPTIONS = [
  { value: 'full', label: 'Full', desc: 'With labels' },
  { value: 'compact', label: 'Compact', desc: 'Small icons + labels' },
  { value: 'icon-only', label: 'Icon Only', desc: 'No labels' },
];

interface ThemeSettings {
  app_theme: string;
  theme_primary: string;
  theme_secondary: string;
  theme_accent: string;
  fontFamily: string;
  fontSize: string;
  sidebarStyle: string;
  layout: string;
  showLogo: boolean;
  showFooter: boolean;
  showBreadcrumb: boolean;
  enableAnimations: boolean;
  enableDarkMode: boolean;
}

const DEFAULT_THEME: ThemeSettings = {
  app_theme: 'default',
  theme_primary: '#667eea',
  theme_secondary: '#764ba2',
  theme_accent: '#f093fb',
  fontFamily: 'inter',
  fontSize: 'medium',
  sidebarStyle: 'full',
  layout: 'wide',
  showLogo: true,
  showFooter: true,
  showBreadcrumb: true,
  enableAnimations: true,
  enableDarkMode: false,
};

export default function ThemeSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('presets');
  const [settings, setSettings] = useState<ThemeSettings>({ ...DEFAULT_THEME });
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const map = data.map || {};
        setSettings(prev => ({
          ...prev,
          app_theme: map.app_theme || 'default',
          theme_primary: map.theme_primary || '#667eea',
          theme_secondary: map.theme_secondary || '#764ba2',
          theme_accent: map.theme_accent || '#f093fb',
        }));
      }
    } catch {
      // Use defaults
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => { await fetchSettings(); };
    load();
  }, [fetchSettings]);

  const saveSettings = async (themeData: Partial<ThemeSettings>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: themeData }),
      });
      if (res.ok) {
        toast.success('Theme saved successfully');
        fetchSettings();
      } else {
        toast.error('Failed to save theme');
      }
    } catch {
      toast.error('Network error');
    }
    setSaving(false);
  };

  const applyPreset = async (theme: typeof PREDEFINED_THEMES[0]) => {
    const data = {
      app_theme: theme.key,
      theme_primary: theme.primary,
      theme_secondary: theme.secondary,
      theme_accent: theme.accent,
    };
    setSettings(prev => ({ ...prev, ...data }));
    await saveSettings(data);
  };

  const saveCustomTheme = async () => {
    await saveSettings({
      theme_primary: settings.theme_primary,
      theme_secondary: settings.theme_secondary,
      theme_accent: settings.theme_accent,
      app_theme: 'custom',
    });
  };

  const resetToDefault = () => {
    setSettings({ ...DEFAULT_THEME });
    toast.info('Reset to default theme');
  };

  const activeColors = previewTheme
    ? PREDEFINED_THEMES.find(t => t.key === previewTheme) || settings
    : settings;

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
            <Button variant="outline" size="sm" onClick={resetToDefault} className="min-h-[44px]">
              <Undo2 className="w-4 h-4 mr-2" /> Reset Defaults
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="presets" className="data-[state=active]:bg-white"><SwatchBook className="w-4 h-4 mr-2" />Presets</TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-white"><Paintbrush className="w-4 h-4 mr-2" />Custom</TabsTrigger>
            <TabsTrigger value="typography" className="data-[state=active]:bg-white"><Type className="w-4 h-4 mr-2" />Typography</TabsTrigger>
            <TabsTrigger value="layout" className="data-[state=active]:bg-white"><Layout className="w-4 h-4 mr-2" />Layout</TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-white"><Eye className="w-4 h-4 mr-2" />Preview</TabsTrigger>
          </TabsList>

          {/* ═══ Presets Tab — CI3 theme cards with gradient previews ═══ */}
          <TabsContent value="presets" className="space-y-6">
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <SwatchBook className="w-5 h-5 text-emerald-600" /> Predefined Themes
                </CardTitle>
                <CardDescription>Choose from professionally designed color schemes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {PREDEFINED_THEMES.map(theme => {
                    const isActive = settings.app_theme === theme.key;
                    return (
                      <button
                        key={theme.key}
                        onClick={() => applyPreset(theme)}
                        className={`rounded-xl border-2 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg text-left ${
                          isActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Gradient preview — matching CI3 */}
                        <div
                          className="h-24 relative flex items-end p-2"
                          style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}
                        >
                          <div
                            className="w-full h-6 rounded opacity-90"
                            style={{ backgroundColor: theme.accent }}
                          />
                        </div>
                        {/* Theme name */}
                        <div className="px-3 py-2.5 bg-white flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{theme.name}</span>
                          {isActive && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ Custom Tab — color pickers like CI3 ═══ */}
          <TabsContent value="custom" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Paintbrush className="w-5 h-5 text-violet-600" /> Custom Colors
                  </CardTitle>
                  <CardDescription>Define your own brand colors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Primary */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.theme_primary}
                        onChange={e => setSettings(prev => ({ ...prev, theme_primary: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <Input
                        value={settings.theme_primary}
                        onChange={e => setSettings(prev => ({ ...prev, theme_primary: e.target.value }))}
                        className="flex-1 font-mono text-sm"
                      />
                      <div className="w-10 h-10 rounded-lg border" style={{ backgroundColor: settings.theme_primary }} />
                    </div>
                  </div>
                  {/* Secondary */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Secondary Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.theme_secondary}
                        onChange={e => setSettings(prev => ({ ...prev, theme_secondary: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <Input
                        value={settings.theme_secondary}
                        onChange={e => setSettings(prev => ({ ...prev, theme_secondary: e.target.value }))}
                        className="flex-1 font-mono text-sm"
                      />
                      <div className="w-10 h-10 rounded-lg border" style={{ backgroundColor: settings.theme_secondary }} />
                    </div>
                  </div>
                  {/* Accent */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Accent Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.theme_accent}
                        onChange={e => setSettings(prev => ({ ...prev, theme_accent: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <Input
                        value={settings.theme_accent}
                        onChange={e => setSettings(prev => ({ ...prev, theme_accent: e.target.value }))}
                        className="flex-1 font-mono text-sm"
                      />
                      <div className="w-10 h-10 rounded-lg border" style={{ backgroundColor: settings.theme_accent }} />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={saveCustomTheme} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                      {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Apply Custom Theme
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Live preview card */}
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="rounded-xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${settings.theme_primary} 0%, ${settings.theme_secondary} 100%)` }}>
                      <p className="text-sm font-semibold">Primary Gradient</p>
                      <p className="text-xs opacity-75 mt-1">Used for headers, buttons, and active states</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-4 text-white" style={{ backgroundColor: settings.theme_primary }}>
                        <p className="text-sm font-semibold">Primary</p>
                      </div>
                      <div className="rounded-xl p-4 text-white" style={{ backgroundColor: settings.theme_secondary }}>
                        <p className="text-sm font-semibold">Secondary</p>
                      </div>
                    </div>
                    <div className="rounded-xl p-4 border-2" style={{ borderColor: settings.theme_accent }}>
                      <p className="text-sm font-semibold" style={{ color: settings.theme_accent }}>Accent Color</p>
                      <p className="text-xs text-slate-500 mt-1">Used for badges, links, highlights</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="px-4 py-2 text-white rounded-lg text-xs font-medium" style={{ backgroundColor: settings.theme_primary }}>Primary Button</div>
                      <div className="px-4 py-2 rounded-lg text-xs font-medium border-2" style={{ borderColor: settings.theme_primary, color: settings.theme_primary }}>Outline Button</div>
                      <div className="px-4 py-2 text-white rounded-lg text-xs font-medium" style={{ backgroundColor: settings.theme_accent }}>Accent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══ Typography Tab ═══ */}
          <TabsContent value="typography" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Font Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1 block">Font Family</Label>
                    <Select value={settings.fontFamily} onValueChange={v => setSettings(prev => ({ ...prev, fontFamily: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1 block">Base Font Size</Label>
                    <Select value={settings.fontSize} onValueChange={v => setSettings(prev => ({ ...prev, fontSize: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (14px)</SelectItem>
                        <SelectItem value="medium">Medium (16px) — Default</SelectItem>
                        <SelectItem value="large">Large (18px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Typography Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                    <h1 className="text-2xl font-bold text-slate-900">Heading 1 — Dashboard</h1>
                    <h2 className="text-lg font-semibold text-slate-800">Heading 2 — Student Management</h2>
                    <h3 className="text-base font-medium text-slate-700">Heading 3 — Class List</h3>
                    <p className="text-sm text-slate-600">Body text — The quick brown fox jumps over the lazy dog. GHS 1,250.00 received.</p>
                    <p className="text-xs text-slate-500">Caption — Last updated: April 16, 2026 at 10:30 AM</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══ Layout Tab ═══ */}
          <TabsContent value="layout" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Sidebar Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Style</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {SIDEBAR_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setSettings(prev => ({ ...prev, sidebarStyle: opt.value }))}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            settings.sidebarStyle === opt.value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className={`text-sm font-medium ${settings.sidebarStyle === opt.value ? 'text-emerald-700' : 'text-slate-600'}`}>{opt.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Content Layout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Layout Mode</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {LAYOUT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setSettings(prev => ({ ...prev, layout: opt.value }))}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            settings.layout === opt.value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className={`text-sm font-medium ${settings.layout === opt.value ? 'text-emerald-700' : 'text-slate-600'}`}>{opt.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══ Preview Tab ═══ */}
          <TabsContent value="preview" className="space-y-6">
            <Card className="border-slate-200/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Theme Preview</CardTitle>
                <CardDescription>Preview how the active theme looks across common UI elements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Sidebar preview */}
                  <div className="flex gap-4">
                    <div
                      className="w-48 rounded-xl p-3 text-white space-y-2"
                      style={{ background: `linear-gradient(180deg, ${activeColors.theme_primary} 0%, ${activeColors.theme_secondary} 100%)` }}
                    >
                      <div className="h-8 rounded bg-white/20 flex items-center px-2">
                        <Monitor className="w-4 h-4" />
                      </div>
                      {['Dashboard', 'Students', 'Teachers', 'Routine', 'Settings'].map(item => (
                        <div key={item} className="px-3 py-1.5 rounded text-xs opacity-80 hover:opacity-100 cursor-default">{item}</div>
                      ))}
                    </div>
                    <div className="flex-1 rounded-xl border p-4 space-y-3">
                      <div className="h-6 w-40 rounded bg-slate-200" />
                      <div className="h-3 w-64 rounded bg-slate-100" />
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-20 rounded-lg border p-2 space-y-1">
                            <div className="h-3 w-16 rounded bg-slate-100" />
                            <div className="h-2 w-24 rounded bg-slate-50" />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <div className="px-3 py-1.5 text-white rounded text-[10px]" style={{ backgroundColor: activeColors.theme_primary }}>Button</div>
                        <div className="px-3 py-1.5 rounded text-[10px] border-2" style={{ borderColor: activeColors.theme_primary, color: activeColors.theme_primary }}>Outline</div>
                        <div className="px-3 py-1.5 text-white rounded text-[10px]" style={{ backgroundColor: activeColors.theme_accent }}>Accent</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
