'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  AlertTriangle, AlertCircle, Clock, DollarSign, Shield, CreditCard,
  TrendingDown, Wallet, Bell, Info,
} from 'lucide-react';

interface Alert {
  type: string;
  severity: string;
  title: string;
  description: string;
  amount?: number;
  studentName?: string;
  studentCode?: string;
  reference?: string;
  days?: number;
  method?: string;
  requestType?: string;
  daysPending?: number;
  breakdown?: Record<string, number>;
}

interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  overdue: number;
  highBalance: number;
  unusual: number;
  shortfall: number;
  pendingApprovals: number;
}

function fmt(n: number) { return `GH\u20B5 ${(n || 0).toFixed(2)}`; }

const severityConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  critical: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertCircle },
  high: { label: 'High', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle },
  medium: { label: 'Medium', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200', icon: Info },
  low: { label: 'Low', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: Bell },
};

const typeConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  overdue: { label: 'Overdue', icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
  high_balance: { label: 'High Balance', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
  unusual: { label: 'Unusual Txn', icon: TrendingDown, color: 'text-violet-600', bg: 'bg-violet-50' },
  shortfall: { label: 'Shortfall', icon: DollarSign, color: 'text-sky-600', bg: 'bg-sky-50' },
  pending_approvals: { label: 'Pending Approval', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

function FinancialAlertsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-48 mb-1" />
        <Skeleton className="h-4 w-80" />
        <div className="border-b border-slate-100 mt-3" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function FinancialAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeType !== 'all' ? `?type=${activeType}` : '';
      const res = await fetch(`/api/admin/financial-alerts${params}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
      setSummary(data.summary || null);
    } catch { toast.error('Failed to load alerts'); } finally { setLoading(false); }
  }, [activeType]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  if (loading && !summary) return (
    <DashboardLayout>
      <FinancialAlertsSkeleton />
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Financial Alerts</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor overdue payments, high balances, and unusual activity</p>
        </div>

        {/* Severity Summary */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: summary.total, icon: Bell, borderColor: 'border-slate-500', iconBg: 'bg-slate-500' },
              { label: 'Critical', value: summary.critical, icon: AlertCircle, borderColor: 'border-red-500', iconBg: 'bg-red-500' },
              { label: 'High', value: summary.high, icon: AlertTriangle, borderColor: 'border-amber-500', iconBg: 'bg-amber-500' },
              { label: 'Medium', value: summary.medium, icon: Info, borderColor: 'border-sky-500', iconBg: 'bg-sky-500' },
              { label: 'Low', value: summary.low, icon: Bell, borderColor: 'border-slate-400', iconBg: 'bg-slate-400' },
            ].map(s => (
              <Card key={s.label} className={`rounded-2xl border-l-4 ${s.borderColor} hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Type Filter Tabs */}
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="gap-1.5 min-h-[44px]"><Bell className="w-3.5 h-3.5" />All</TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1.5 min-h-[44px]"><Clock className="w-3.5 h-3.5" />Overdue</TabsTrigger>
            <TabsTrigger value="high_balance" className="gap-1.5 min-h-[44px]"><Wallet className="w-3.5 h-3.5" />High Balance</TabsTrigger>
            <TabsTrigger value="unusual" className="gap-1.5 min-h-[44px]"><TrendingDown className="w-3.5 h-3.5" />Unusual</TabsTrigger>
            <TabsTrigger value="shortfall" className="gap-1.5 min-h-[44px]"><DollarSign className="w-3.5 h-3.5" />Shortfall</TabsTrigger>
            <TabsTrigger value="pending_approvals" className="gap-1.5 min-h-[44px]"><Shield className="w-3.5 h-3.5" />Pending</TabsTrigger>
          </TabsList>

          <TabsContent value={activeType} className="mt-4">
            <Card className="rounded-2xl border-slate-200/60">
              <CardContent className="p-0">
                <ScrollArea className="max-h-[700px]">
                  {loading ? (
                    <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                  ) : alerts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 mx-auto flex items-center justify-center mb-3">
                        <AlertCircle className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">No alerts found</p>
                      <p className="text-xs text-slate-400 mt-1">Everything looks good — no financial issues detected</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {alerts.map((alert, i) => {
                        const sevCfg = severityConfig[alert.severity] || severityConfig.medium;
                        const typeCfg = typeConfig[alert.type] || typeConfig.overdue;
                        const SevIcon = sevCfg.icon;
                        const TypeIcon = typeCfg.icon;
                        return (
                          <div key={i} className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-lg ${sevCfg.bg} border flex items-center justify-center flex-shrink-0`}>
                                <SevIcon className={`w-4 h-4 ${sevCfg.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
                                  <Badge variant="outline" className={`${sevCfg.bg} ${sevCfg.color} text-[10px]`}>{sevCfg.label}</Badge>
                                  <Badge variant="outline" className={`${typeCfg.bg} ${typeCfg.color} text-[10px]`}>{typeCfg.label}</Badge>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{alert.description}</p>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {alert.studentName && (
                                    <span className="text-[10px] text-slate-400">
                                      Student: <span className="font-medium text-slate-600">{alert.studentName}</span>
                                      {alert.studentCode && <span className="font-mono ml-1">({alert.studentCode})</span>}
                                    </span>
                                  )}
                                  {alert.amount !== undefined && (
                                    <span className="text-[10px] font-mono font-semibold text-red-600 tabular-nums">{fmt(alert.amount)}</span>
                                  )}
                                  {alert.days !== undefined && (
                                    <span className="text-[10px] text-slate-400">{alert.days} days</span>
                                  )}
                                  {alert.daysPending !== undefined && (
                                    <span className="text-[10px] text-slate-400">{alert.daysPending} days pending</span>
                                  )}
                                  {alert.method && (
                                    <span className="text-[10px] text-slate-400">Method: {alert.method}</span>
                                  )}
                                  {alert.reference && (
                                    <span className="text-[10px] font-mono text-slate-400">{alert.reference}</span>
                                  )}
                                </div>
                                {alert.breakdown && (
                                  <div className="flex gap-2 mt-2">
                                    {Object.entries(alert.breakdown).map(([key, val]) => (
                                      val > 0 ? <Badge key={key} variant="outline" className="text-[10px]">{key}: {fmt(val)}</Badge> : null
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
