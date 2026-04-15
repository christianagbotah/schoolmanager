'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Globe, Image, Newspaper, PartyPopper, FileText, ChevronRight, LayoutDashboard,
  Layers, ArrowUpRight, Clock, Plus,
} from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  slides: number;
  events: number;
  news: number;
  galleries: number;
  images: number;
  pages: number;
}

interface RecentItem {
  type: 'event' | 'news' | 'gallery';
  title: string;
  date: string | null;
}

export default function FrontendDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ slides: 0, events: 0, news: 0, galleries: 0, images: 0, pages: 0 });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sliderRes, eventsRes, newsRes, galleryRes, pagesRes] = await Promise.all([
        fetch('/api/admin/frontend/slider'),
        fetch('/api/admin/frontend/events'),
        fetch('/api/admin/frontend/news'),
        fetch('/api/admin/frontend/gallery'),
        fetch('/api/admin/frontend/pages'),
      ]);
      const sliderData = await sliderRes.json();
      const eventsData = await eventsRes.json();
      const newsData = await newsRes.json();
      const galleryData = await galleryRes.json();
      const pagesData = await pagesRes.json();

      setStats({
        slides: sliderData.stats?.total || 0,
        events: eventsData.stats?.total || 0,
        news: newsData.stats?.total || 0,
        galleries: galleryData.stats?.total || 0,
        images: galleryData.stats?.totalImages || 0,
        pages: pagesData.stats?.total || 0,
      });

      // Build recent items
      const items: RecentItem[] = [];
      (eventsData.events || []).slice(0, 3).forEach((e: { title: string; date: string | null }) => {
        items.push({ type: 'event', title: e.title, date: e.date });
      });
      (newsData.news || []).slice(0, 3).forEach((n: { title: string; date: string | null }) => {
        items.push({ type: 'news', title: n.title, date: n.date });
      });
      (galleryData.galleries || []).slice(0, 2).forEach((g: { title: string; date: string | null }) => {
        items.push({ type: 'gallery', title: g.title, date: g.date });
      });
      setRecent(items);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sections = [
    {
      title: 'Hero Slider',
      description: 'Manage homepage hero banner slides with images, titles and CTAs',
      icon: Image,
      count: stats.slides,
      href: '/admin/frontend/slider',
      color: 'from-violet-500 to-purple-600',
      badgeColor: 'bg-violet-100 text-violet-700',
    },
    {
      title: 'Events',
      description: 'Create and manage school events, activities and programs',
      icon: PartyPopper,
      count: stats.events,
      href: '/admin/frontend/events',
      color: 'from-emerald-500 to-teal-600',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'News & Articles',
      description: 'Publish news, announcements and articles for the website',
      icon: Newspaper,
      count: stats.news,
      href: '/admin/frontend/news',
      color: 'from-amber-500 to-orange-600',
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Photo Gallery',
      description: 'Create albums and manage photo uploads for the gallery',
      icon: Layers,
      count: stats.galleries,
      subCount: `${stats.images} photos`,
      href: '/admin/frontend/gallery',
      color: 'from-rose-500 to-pink-600',
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      title: 'Static Pages',
      description: 'Edit About Us, Privacy Policy, Terms & Conditions pages',
      icon: FileText,
      count: stats.pages,
      href: '/admin/frontend/pages',
      color: 'from-sky-500 to-blue-600',
      badgeColor: 'bg-sky-100 text-sky-700',
    },
  ];

  const typeIcon = (type: string) => {
    if (type === 'event') return <PartyPopper className="w-4 h-4 text-emerald-600" />;
    if (type === 'news') return <Newspaper className="w-4 h-4 text-amber-600" />;
    return <Layers className="w-4 h-4 text-rose-600" />;
  };

  const typeColor = (type: string) => {
    if (type === 'event') return 'bg-emerald-100 text-emerald-700';
    if (type === 'news') return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Frontend CMS</h1>
              <p className="text-sm text-slate-500">Manage your school website content</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : (
            <>
              {[
                { label: 'Slides', value: stats.slides, color: 'text-violet-600' },
                { label: 'Events', value: stats.events, color: 'text-emerald-600' },
                { label: 'News', value: stats.news, color: 'text-amber-600' },
                { label: 'Albums', value: stats.galleries, color: 'text-rose-600' },
                { label: 'Photos', value: stats.images, color: 'text-pink-600' },
                { label: 'Pages', value: stats.pages, color: 'text-sky-600' },
              ].map((s) => (
                <Card key={s.label} className="border-slate-200/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Content Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
          ) : (
            sections.map((section) => (
              <Card
                key={section.href}
                className="border-slate-200/60 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(section.href)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center shadow-sm`}>
                        <section.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{section.description}</CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Badge className={`${section.badgeColor} text-xs`}>{section.count} items</Badge>
                    {section.subCount && (
                      <Badge variant="outline" className="text-xs">{section.subCount}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Recent Activity */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-slate-500">
                <Plus className="w-4 h-4 mr-1" /> Quick Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No content yet. Start by adding slides, events or news.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recent.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {typeIcon(item.type)}
                      <span className="text-sm text-slate-700 truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`${typeColor(item.type)} text-[10px] capitalize`}>{item.type}</Badge>
                      {item.date && (
                        <span className="text-[11px] text-slate-400">{format(new Date(item.date), 'dd MMM yyyy')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
