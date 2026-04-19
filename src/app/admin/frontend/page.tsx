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

function FrontendSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      {/* Section cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
      {/* Recent skeleton */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
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

  const statCards = [
    { label: 'Slides', value: stats.slides, borderColor: 'border-l-violet-500', iconBg: 'bg-violet-500', valueColor: 'text-violet-600' },
    { label: 'Events', value: stats.events, borderColor: 'border-l-emerald-500', iconBg: 'bg-emerald-500', valueColor: 'text-emerald-600' },
    { label: 'News', value: stats.news, borderColor: 'border-l-amber-500', iconBg: 'bg-amber-500', valueColor: 'text-amber-600' },
    { label: 'Albums', value: stats.galleries, borderColor: 'border-l-rose-500', iconBg: 'bg-rose-500', valueColor: 'text-rose-600' },
    { label: 'Photos', value: stats.images, borderColor: 'border-l-pink-500', iconBg: 'bg-pink-500', valueColor: 'text-pink-600' },
    { label: 'Pages', value: stats.pages, borderColor: 'border-l-sky-500', iconBg: 'bg-sky-500', valueColor: 'text-sky-600' },
  ];

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

  if (loading) {
    return (
      <DashboardLayout>
        <FrontendSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Frontend CMS</h1>
              <p className="text-sm text-slate-500">Manage your school website content</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border border-slate-200/60 border-l-4 ${s.borderColor} bg-white p-4 flex flex-col items-center gap-1 hover:-translate-y-0.5 hover:shadow-lg transition-all`}
            >
              <p className={`text-2xl font-bold tabular-nums ${s.valueColor}`}>{s.value}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Content Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => (
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
          ))}
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
            {recent.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm text-slate-500 font-medium">No content yet</p>
                <p className="text-slate-400 text-sm mt-1">Start by adding slides, events or news.</p>
              </div>
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
